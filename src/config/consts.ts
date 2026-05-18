const PASSWORD_SALT = 10;
const ROLES = ["user", "admin"] as const;
const FORNTEND_URL = "http://localhost:5000";
const VERIFY_EMAIL_URL = `${FORNTEND_URL}/auth/verify-email`;
const SITE_NAME = "UNKNOW"

export {PASSWORD_SALT, ROLES, FORNTEND_URL, VERIFY_EMAIL_URL, SITE_NAME};