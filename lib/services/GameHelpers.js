import { PlayableTeamIds } from '../constants';

export function getCaptainsTeam(user, teams) {
    for (let id of PlayableTeamIds) {
        let team = teams[id];
        if (team?.captain && team?.captain.id == user?.id) return team;
    }
    return null;
}

export function randomString(length) {
    let string = '';
    while (string.length < length) {
        let char;
        do {
            char = String.fromCharCode(97 + Math.floor(Math.random() * 26));
        } while ('aeiou'.lastIndexOf(char) >= 0);
        string += char;
    }
    return string;
}
