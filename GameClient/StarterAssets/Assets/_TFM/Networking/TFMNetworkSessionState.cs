using System;
using UnityEngine;

namespace TFM.Networking
{
    public sealed class TFMNetworkSessionState : MonoBehaviour
    {
        [SerializeField] private TFMNetworkRole role = TFMNetworkRole.Offline;
        [SerializeField] private string sessionId = "";
        [SerializeField] private string matchId = "";

        public TFMNetworkRole Role => role;
        public string SessionId => sessionId;
        public string MatchId => matchId;
        public bool IsConnected => role != TFMNetworkRole.Offline;

        public event Action Changed;

        public void SetSession(TFMNetworkRole nextRole, string nextSessionId, string nextMatchId)
        {
            role = nextRole;
            sessionId = nextSessionId ?? string.Empty;
            matchId = nextMatchId ?? string.Empty;
            Changed?.Invoke();
        }

        public void Clear()
        {
            SetSession(TFMNetworkRole.Offline, string.Empty, string.Empty);
        }
    }
}
