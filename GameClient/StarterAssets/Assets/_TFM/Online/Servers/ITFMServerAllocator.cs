using System;

namespace TFM.Online.Servers
{
    public interface ITFMServerAllocator
    {
        void Request(string matchId, string region, Action<TFMServerAllocationData> completed);
    }
}
