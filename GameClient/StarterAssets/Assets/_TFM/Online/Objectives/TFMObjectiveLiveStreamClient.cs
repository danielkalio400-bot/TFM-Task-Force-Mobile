using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace TFM.Online.Objectives
{
    /// <summary>
    /// Unity read-only SSE client. Credentials are passed at runtime; nothing
    /// is persisted to a local player settings store, assets or logs. Actual BazID sign-in
    /// and server token issuance are outside this component.
    /// </summary>
    public sealed class TFMObjectiveLiveStreamClient : MonoBehaviour
    {
        public TFMServerObjectiveSnapshot Current => _cursor.Snapshot;
        public long LastEventSequence => _cursor.LastEventSequence;
        public string Status { get; private set; } = "disconnected";
        public bool IsConnected { get; private set; }
        public event Action<TFMServerObjectiveSnapshot> SnapshotUpdated;

        private readonly TFMObjectiveEventCursor _cursor = new TFMObjectiveEventCursor();
        private UnityWebRequest _request;
        private Coroutine _routine;
        private string _viewerToken;
        private string _matchId;

        private sealed class EventDownload : DownloadHandlerScript
        {
            private readonly TFMObjectiveSseFrameParser _parser = new TFMObjectiveSseFrameParser();
            private readonly Decoder _utf8Decoder = new UTF8Encoding(false, true).GetDecoder();
            private readonly Action<TFMObjectiveSseFrameParser.Frame> _callback;
            private readonly char[] _characters = new char[32768];

            public EventDownload(Action<TFMObjectiveSseFrameParser.Frame> callback)
                : base(new byte[16384]) { _callback = callback; }

            protected override bool ReceiveData(byte[] data, int dataLength)
            {
                if (data == null || dataLength <= 0) return true;
                try
                {
                    int offset = 0;
                    while (offset < dataLength)
                    {
                        int size = Math.Min(dataLength - offset, 8192);
                        int written = _utf8Decoder.GetChars(data, offset, size,
                            _characters, 0, false);
                        offset += size;
                        foreach (var frame in _parser.Append(new string(_characters, 0, written)))
                            _callback(frame);
                        if (_parser.Overflowed) return false;
                    }
                    return true;
                }
                catch (DecoderFallbackException) { return false; }
            }
        }

        public bool Connect(string endpointBaseUrl, string matchId, string viewerToken)
        {
            if (string.IsNullOrWhiteSpace(matchId) || string.IsNullOrWhiteSpace(viewerToken)
                || !Uri.TryCreate(endpointBaseUrl, UriKind.Absolute, out Uri origin)
                || (origin.Scheme != Uri.UriSchemeHttps &&
                    !(origin.Scheme == Uri.UriSchemeHttp &&
                      (origin.Host == "127.0.0.1" || origin.Host == "localhost"))))
            {
                Status = "invalid-connection-configuration";
                return false;
            }
            Disconnect();
            _cursor.Clear();
            _matchId = matchId;
            _viewerToken = viewerToken;
            _routine = StartCoroutine(Run(origin));
            return true;
        }

        private IEnumerator Run(Uri origin)
        {
            // UriBuilder encodes only the match ID; no access tokens in URLs.
            var path = "/v1/dev/objective-live/" +
                Uri.EscapeDataString(_matchId) + "/events?afterSequence=" +
                _cursor.LastEventSequence;
            Uri url = new Uri(origin.GetLeftPart(UriPartial.Authority) + path);
            using (var request = new UnityWebRequest(url, UnityWebRequest.kHttpVerbGET))
            {
                _request = request;
                request.downloadHandler = new EventDownload(HandleFrame);
                request.SetRequestHeader("Accept", "text/event-stream");
                request.SetRequestHeader("Authorization", "Bearer " + _viewerToken);
                request.timeout = 75;
                Status = "connecting";
                yield return request.SendWebRequest();
                IsConnected = false;
                Status = request.result == UnityWebRequest.Result.Success
                    ? "disconnected" : "stream-ended";
                _request = null;
            }
            _viewerToken = null;
            _routine = null;
        }

        private void HandleFrame(TFMObjectiveSseFrameParser.Frame frame)
        {
            if (frame.EventType == "access-ended")
            {
                Status = "access-ended";
                _request?.Abort();
                return;
            }
            if (frame.EventType != "snapshot" && frame.EventType != "delta" &&
                frame.EventType != "resync") return;
            TFMObjectiveReconnectView view;
            try { view = JsonUtility.FromJson<TFMObjectiveReconnectView>(frame.Json); }
            catch { Status = "invalid-stream-data"; _request?.Abort(); return; }
            if (view == null || !_cursor.Apply(view))
            {
                Status = "resync-required";
                _request?.Abort();
                return;
            }
            IsConnected = true;
            Status = "streaming";
            SnapshotUpdated?.Invoke(_cursor.Snapshot);
        }

        public void Disconnect()
        {
            if (_request != null) _request.Abort();
            if (_routine != null) StopCoroutine(_routine);
            _routine = null;
            _request = null;
            _viewerToken = null;
            IsConnected = false;
            Status = "disconnected";
        }

        private void OnDisable() { Disconnect(); }
        private void OnDestroy() { Disconnect(); }
    }
}
