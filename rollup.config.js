import scss from 'rollup-plugin-scss';
import ts from 'rollup-plugin-typescript2';
import {terser} from 'rollup-plugin-terser';
import html from 'rollup-plugin-html';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('./package.json');

const plugins = [
    scss({output: false}),
    html(),
    ts()
];

const sourcemaps = process.env.BUILD === 'dev' ? 'inline' : true;

if (process.env.BUILD !== 'dev') {
    plugins.push(terser());
}

export default [
    {
        input: 'src/index.ts',
        output: [
            { file: pkg['browser'].replace('.js', '.module.js'), format: 'es', sourcemap: sourcemaps },
            { file: pkg['browser'], format: 'iife', name: 'ASSelect', sourcemap: sourcemaps },
        ],
        plugins: plugins
    },
    {
        input: 'src/ASSelect/ASSelect.init.scss',
        output: { file: pkg['browser'].replace('.js', '.init.js') },
        plugins: [scss({ output: true })]
    },
    {
        input: 'src/ElementInternals/ElementInternals.polyfill.ts',
        output: [{ file: "dist/elementinternals.polyfill.js", format: 'iife', sourcemap: true }],
        plugins: plugins
    }
];
