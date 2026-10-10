using TFM.Gameplay.Match;

namespace TFM.Gameplay.Modes
{
    public interface ITFMModeRuleSet
    {
        string ModeId { get; }
        bool IsComplete(TFMModeRuntimeContext context);
        string ResolveWinningTeam(TFMModeRuntimeContext context);
    }
}
