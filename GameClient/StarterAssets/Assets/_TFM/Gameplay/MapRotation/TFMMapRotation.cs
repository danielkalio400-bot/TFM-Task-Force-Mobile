using System;
using System.Collections.Generic;
using System.Linq;

namespace TFM.Gameplay.MapRotation
{
    public sealed class TFMMapRotation
    {
        private readonly List<TFMMapEntry> _entries = new();

        public void Replace(IEnumerable<TFMMapEntry> entries)
        {
            _entries.Clear();
            if (entries == null) return;
            _entries.AddRange(entries.Where(entry => entry != null));
        }

        public IReadOnlyList<TFMMapEntry> Eligible(string modeId)
        {
            return _entries
                .Where(entry =>
                    entry.Enabled &&
                    entry.Weight > 0 &&
                    entry.SupportedModeIds.Contains(modeId))
                .ToArray();
        }
    }
}
