class InMemoryMessageStore {
    messages: any[];

    constructor() {
        this.messages = [];
    }

    saveMessage(message: any) {
        this.messages.push(message);
    }

    findAllMessagesRelatedToUser(userID: string) {
        return this.messages.filter(
            ({ author, to }) => author === userID || to === userID
        );
    }
}

export default new InMemoryMessageStore();