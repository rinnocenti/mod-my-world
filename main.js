import { LongRest } from './scripts/macrolongrest.js';
import { Visitar } from './scripts/visitar.js';
import * as Actions from './scripts/singleActions.js';
import { SetTriggerFlag } from './scripts/SetTriggerFlag.js';
//import * as RegisterEncounter from './scripts/encounter.js';
Hooks.once('init', function () {

});
window.Innocenti = {
    LongRest: LongRest,
    Visitar: Visitar,
    SetFlag: SetTriggerFlag,
    Actions: Actions.SingleActions,
    Checks: Actions.Checks,
    PassiveCheck: Actions.PassivePerception,
    OpenDoor: Actions.OpenDoor,
    PoolCheck: Actions.PoolCheck,
    PoolFlags: Actions.PoolFlags
};