/** @type {import('stylelint').Config} */
export default {
    extends: ["stylelint-config-standard"],
    plugins: ["stylelint-order"],
    rules: {
        "order/properties-alphabetical-order": null,
        "at-rule-no-unknown": [
            true,
            {
                ignoreAtRules: [
                    "tailwind",
                    "apply",
                    "variants",
                    "responsive",
                    "screen",
                ],
            },
        ],
        'color-function-alias-notation': null,
        'alpha-value-notation': null,
        'color-function-notation': null,
        "declaration-no-important": true,
        "no-descending-specificity": null,
        "comment-empty-line-before": null,
        "rule-empty-line-before": null,
        "selector-class-pattern": [
            "^([a-z][a-z0-9-]*(__[a-z0-9-]+)?(--[a-z0-9-]+)?|Mui.*)$",
            {
                resolveNestedSelectors: true,
                message: (selector) => {
                    const value = typeof selector === 'string' ? selector : selector.toString();

                    if (value.includes('_') && !value.includes('__')) {
                        return `A classe "${value}" usa snake_case (sublinhado simples). No padrão BEM, use sublinhado duplo (__) apenas para elementos ou hífen (-) para separar palavras. Ex: .bloco__elemento`;
                    }

                    if (/[A-Z]/.test(value) && !value.startsWith('Mui')) {
                        return `A classe "${value}" contém letras maiúsculas. O padrão BEM usa kebab-case (tudo minúsculo separado por hífens). Ex: .meu-bloco`;
                    }

                    if (!value.match(/^([a-z][a-z0-9-]*(__[a-z0-9-]+)?(--[a-z0-9-]+)?|Mui.*)$/)) {
                        return `A classe "${value}" não segue a estrutura BEM (Bloco__Elemento--Modificador). Ex: .bloco__elemento--modificador`;
                    }

                    return `A classe "${value}" não segue o padrão BEM esperado.`;
                },
            },
        ],
        "declaration-empty-line-before": "never",
    },
};
