export default class Team {
    constructor(id, name, color) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.pts = 0;
        this.captainId = null;
    }

    resetPoints() {
        this.pts = 0;
    }

    addPoint() {
        this.pts++;
    }
}
