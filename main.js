import * as TriggerChecks from './scripts/automationTrigger.js';
import { LongRest } from './scripts/macrolongrest.js';
import { Visitar } from './scripts/visitar.js';
import * as RegisterEncounter from './scripts/encounter.js';
window.Innocenti = {
    LongRest: LongRest,
    Visitar: Visitar,
    RegisterEncounter: RegisterEncounter.RegisterEncounter,
    RollEncounter: RegisterEncounter.RollEncounter,
    CheckSetFlag: TriggerChecks.CheckSetFlag,
    SetFlag: TriggerChecks.SetFlag,
    UnSetFlag: TriggerChecks.UnSetFlag,
    PassiveCheck: TriggerChecks.PassiveCheck,
    Actions: TriggerChecks.Actions,
    Hidden: TriggerChecks.Hidden,
    PauseGame: TriggerChecks.PauseGame,
    PlaySound: TriggerChecks.PlaySound,
    Talk: TriggerChecks.Talk,
    SetDoor: TriggerChecks.SetDoor,
    Permission: TriggerChecks.Permission,
    MoveToken: TriggerChecks.MoveToken,
    HitTarget: TriggerChecks.HitTarget,
    Checks: TriggerChecks.Checks,
    OpenDoor: TriggerChecks.OpenDoor,
    PressTable: TriggerChecks.PressTable,
    SetSceneFlag: TriggerChecks.SetSceneFlag,
    HitAllTargets: TriggerChecks.HitAllTargets,
    MoveAllTokens: TriggerChecks.MoveAllTokens,
    PoolToken: TriggerChecks.PoolToken
};