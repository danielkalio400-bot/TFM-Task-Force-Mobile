using System;
using UnityEngine;

namespace TFM.Player.State
{
    public sealed class TFMPlayerSessionState : MonoBehaviour
    {
        [SerializeField] private TFMPlayerLifeState lifeState = TFMPlayerLifeState.Alive;
        [SerializeField] private int score;
        [SerializeField] private int assists;
        [SerializeField] private int eliminations;

        public TFMPlayerLifeState LifeState => lifeState;
        public int Score => score;
        public int Assists => assists;
        public int Eliminations => eliminations;

        public event Action<TFMPlayerLifeState> LifeStateChanged;

        public void SetLifeState(TFMPlayerLifeState next)
        {
            if (lifeState == next) return;
            lifeState = next;
            LifeStateChanged?.Invoke(next);
        }

        public void AddScore(int amount)
        {
            if (amount > 0) score += amount;
        }

        public void AddAssist()
        {
            assists++;
        }

        public void AddElimination()
        {
            eliminations++;
        }

        public void ResetForMatch()
        {
            score = 0;
            assists = 0;
            eliminations = 0;
            SetLifeState(TFMPlayerLifeState.Alive);
        }
    }
}
