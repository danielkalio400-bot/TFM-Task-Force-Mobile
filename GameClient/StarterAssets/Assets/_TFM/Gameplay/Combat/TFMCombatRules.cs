namespace TFM.Gameplay.Combat
{
    public static class TFMCombatRules
    {
        public static bool CanDamage(string sourceTeamId, string targetTeamId, bool friendlyFire)
        {
            if (friendlyFire)
            {
                return true;
            }

            if (string.IsNullOrEmpty(sourceTeamId) || string.IsNullOrEmpty(targetTeamId))
            {
                return true;
            }

            return sourceTeamId != targetTeamId;
        }
    }
}
