function validateEmail(email) {
    const regex = /^[a-zA-Z0-9._%+-]{6,}@(gmail\.com|live\.com\.ar|hotmail\.com|outlook\.com)$/;
    return regex.test(email);
}


export { validateEmail }
