export class User {
    constructor(id, username = null, first_name, last_name = null, language_code, is_preminum) {
        this.id = id;
        this.username = username;
        this.first_name = first_name;
        this.last_name = last_name;
        this.language_code = language_code;
        this.is_preminum = is_preminum;
    }
    toString() {
        return `
            ID: ${this.id}
            Username: ${this.username ?? "N/A"}
            First Name: ${this.first_name}
            Last Name: ${this.last_name ?? "N/A"}
            Language: ${this.language_code}
            Premium: ${this.is_premium ? "Yes" : "No"}
            `.trim();
    }
}