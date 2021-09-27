class InMemorySessionStore {
    sessions: Map<string, any>;

    constructor() {
        this.sessions = new Map();
    }

    findSession(id: string) {
        return this.sessions.get(id);
    }

    findSessionByUsername(username: string) {
        const allSessions = this.findAllSessions();
        return allSessions.find((session) => session.username === username);
    }

    saveSession(id: string, session: any) {
        this.sessions.set(id, session);
    }

    findAllSessionsKeys() {
        return [...this.sessions.keys()];
    }

    findAllSessions() {
        return [...this.sessions.values()];
    }
}

export default new InMemorySessionStore();