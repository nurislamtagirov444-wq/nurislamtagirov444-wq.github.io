import { ESLint } from "eslint";

export default [
    {
        files: ["**/*.js", "**/*.ts"],
        rules: {
            "no-unused-vars": "warn",
            "no-console": "off",
        }
    }
];