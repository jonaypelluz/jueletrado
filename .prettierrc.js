module.exports = {
    "semi": true,
    "tabWidth": 4,
    "useTabs": false,
    "printWidth": 100,
    "singleQuote": true,
    "trailingComma": "all",
    "jsxSingleQuote": false,
    "bracketSpacing": true,
    "arrowParens": "always",
    "plugins": [require.resolve("@trivago/prettier-plugin-sort-imports")],
    "importOrder": ["react", "^(?!react)\\w+$", "<THIRD_PARTY_MODULES>", "^[./]"],
    "importOrderSeparation": false,
    "importOrderSortSpecifiers": true
}