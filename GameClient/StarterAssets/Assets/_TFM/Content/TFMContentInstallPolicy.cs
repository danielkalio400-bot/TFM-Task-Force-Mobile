namespace TFM.Content
{
    public sealed class TFMContentInstallPolicy
    {
        public bool CanEnterSection(TFMContentInstallState state, bool onlineRequired)
        {
            if (state == null) return false;
            state.Normalize();
            if (state.State != TFMContentPackState.Installed) return false;
            if (onlineRequired && string.IsNullOrWhiteSpace(state.InstalledVersion)) return false;
            return true;
        }
    }
}
