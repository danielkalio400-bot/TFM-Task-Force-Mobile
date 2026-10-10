using System;

namespace TFM.Gameplay.BattleRoyale
{
    public sealed class TFMZonePolicy
    {
        public void Advance(TFMBattleRoyaleRuntimeState state, double seconds)
        {
            if (state == null || seconds <= 0d || state.FinalStage) return;
            state.Normalize();
            state.SecondsUntilZoneTransition = Math.Max(0d, state.SecondsUntilZoneTransition - seconds);

            if (state.SecondsUntilZoneTransition > 0d) return;

            state.ZoneStage++;
            state.ZoneRadiusMeters = state.NextZoneRadiusMeters;
            state.NextZoneRadiusMeters = Math.Max(75f, state.ZoneRadiusMeters * 0.62f);
            state.SecondsUntilZoneTransition = Math.Max(45d, 120d - state.ZoneStage * 8d);
            state.FinalStage = state.ZoneRadiusMeters <= 100f;
        }
    }
}
