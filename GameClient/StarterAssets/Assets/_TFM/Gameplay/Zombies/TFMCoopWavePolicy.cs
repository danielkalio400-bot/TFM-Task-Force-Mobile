using System;

namespace TFM.Gameplay.Zombies
{
    public sealed class TFMCoopWavePolicy
    {
        public bool CanAdvance(TFMCoopWaveState state)
        {
            if (state == null) return false;
            state.Normalize();
            return !state.Completed &&
                   state.Participants > 0 &&
                   state.RemainingObjectives == 0 &&
                   state.IntermissionSeconds <= 0d;
        }

        public void Advance(TFMCoopWaveState state, int nextObjectiveCount)
        {
            if (!CanAdvance(state)) return;
            state.WaveNumber++;
            state.RemainingObjectives = Math.Max(0, nextObjectiveCount);
            state.IntermissionSeconds = 20d;
        }
    }
}
