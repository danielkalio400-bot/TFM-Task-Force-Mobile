using System;

namespace TFM.Gameplay.Zombies
{
    [Serializable]
    public sealed class TFMCoopWaveState
    {
        public int WaveNumber = 1;
        public int Participants;
        public int RemainingObjectives;
        public double IntermissionSeconds;
        public bool Completed;

        public void Normalize()
        {
            WaveNumber = Math.Max(1, WaveNumber);
            Participants = Math.Clamp(Participants, 0, 16);
            RemainingObjectives = Math.Max(0, RemainingObjectives);
            IntermissionSeconds = Math.Max(0d, IntermissionSeconds);
        }
    }
}
