import { LongRest } from './scripts/macrolongrest.js';
import { Visitar } from './scripts/visitar.js';
import { LootNPC } from './scripts/lootNpc.js';
import * as Actions from './scripts/singleActions.js';
import { SetTriggerFlag } from './scripts/SetTriggerFlag.js';
import { Encounters } from './scripts/encounter.js';
Hooks.once('init', function () {

});
window.Innocenti = {
    LongRest: LongRest,
    Visitar: Visitar,
    Loot: LootNPC,
    SetFlag: SetTriggerFlag,
    Actions: Actions.MultiActions,
    Checks: Actions.Checks,
    PassiveCheck: Actions.PassivePerception,
    OpenDoor: Actions.OpenDoor,
    CheckItem: Actions.CheckItem,
    PoolCheck: Actions.PoolCheck,
    Encounters: Encounters
};