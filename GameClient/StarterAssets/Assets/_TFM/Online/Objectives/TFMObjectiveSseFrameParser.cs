using System;
using System.Collections.Generic;
using System.Text;

namespace TFM.Online.Objectives
{
    // Text framing for a future UnityWebRequest.DownloadHandlerScript.
    // It is not a network connection or a credential store.
    public sealed class TFMObjectiveSseFrameParser
    {
        public const int MaxBufferedChars = 131072;
        private readonly StringBuilder _pending = new StringBuilder();
        public bool Overflowed { get; private set; }

        public struct Frame
        {
            public string EventType;
            public string EventId;
            public string Json;
        }

        public IReadOnlyList<Frame> Append(string chunk)
        {
            var result = new List<Frame>();
            if (Overflowed || string.IsNullOrEmpty(chunk)) return result;
            _pending.Append(chunk.Replace("\r\n", "\n"));
            if (_pending.Length > MaxBufferedChars)
            {
                Overflowed = true;
                _pending.Clear();
                return result;
            }

            int index;
            while ((index = _pending.ToString().IndexOf("\n\n", StringComparison.Ordinal)) >= 0)
            {
                string raw = _pending.ToString(0, index);
                _pending.Remove(0, index + 2);
                string type = string.Empty;
                string id = string.Empty;
                var data = new StringBuilder();
                foreach (string line in raw.Split('\n'))
                {
                    if (line.StartsWith("event: ", StringComparison.Ordinal))
                        type = line.Substring(7);
                    else if (line.StartsWith("id: ", StringComparison.Ordinal))
                        id = line.Substring(4);
                    else if (line.StartsWith("data: ", StringComparison.Ordinal))
                    {
                        if (data.Length > 0) data.Append('\n');
                        data.Append(line.Substring(6));
                    }
                }
                if (data.Length == 0) continue;
                result.Add(new Frame { EventType = type, EventId = id, Json = data.ToString() });
            }
            return result;
        }

        public void Reset()
        {
            _pending.Clear();
            Overflowed = false;
        }
    }
}
