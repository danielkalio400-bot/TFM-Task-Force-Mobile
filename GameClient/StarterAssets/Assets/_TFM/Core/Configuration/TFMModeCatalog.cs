using System;
using System.Collections.Generic;

namespace TFM.Core
{
    public enum MainSection { Multiplayer, BattleRoyale, Zombies, DMZRecon }

    public static class TFMModeCatalog
    {
        // Menu entries only. Every mode needs an independent implementation.
        public static readonly IReadOnlyDictionary<MainSection, string[]> Modes =
            new Dictionary<MainSection, string[]>
            {
                { MainSection.Multiplayer, new [] { "Team Deathmatch", "Frontline", "Domination", "Search & Destroy", "Kill Confirmed", "Hardpoint", "Free-for-All", "Gunfight", "Ranked MP", "League Play" } },
                { MainSection.BattleRoyale, new [] { "Classic BR (100 players)", "Alcatraz", "Tank Battle", "Training Ground", "Blitz", "Solid Gold", "Prop Hunt", "Rotating Events" } },
                { MainSection.Zombies, new [] { "Raid Normal", "Raid Hardcore", "Survival", "Cooperative Defense", "Special Events" } },
                { MainSection.DMZRecon, new [] { "Standard Extraction", "Solo Extraction", "Squad Extraction", "PvPvE Missions", "High-Risk Zones", "Contracts", "Special Recon Operations" } }
            };
    }
}