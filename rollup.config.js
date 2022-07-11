/* eslint-disable import/no-dynamic-require, global-require */
/* global process */
import { terser } from 'rollup-plugin-terser';
import replace from '@rollup/plugin-replace';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default () => {
  const isProduction = process.env.NODE_ENV !== 'development';

  return [
    {
      input: 'src/client/index.js',
      output: [
        {
          file: 'dist/esm/web-router.js',
          format: 'esm',
          sourcemap: true
        },
        {
          file: 'dist/cjs/web-router.js',
          format: 'cjs',
          sourcemap: true
        }
      ],
      plugins: [
        replace({
          preventAssignment: true,
          values: {
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || '')
          }
        }),
        nodeResolve(),
        isProduction
          ? terser({
              keep_classnames: true
            })
          : {}
      ]
    },
    {
      input: 'src/server/index.js',
      output: [
        {
          file: 'dist/esm/web-router.server.js',
          format: 'esm',
          sourcemap: true
        }
      ],
      plugins: [
        isProduction
          ? terser({
              keep_classnames: true
            })
          : {},
        nodeResolve(),
        commonjs()
      ]
    },
    {
      input: 'src/server/plugins/webWidget.js',
      output: [
        {
          file: 'dist/esm/web-widget.server.js',
          format: 'esm',
          sourcemap: true
        }
      ],
      plugins: [
        isProduction
          ? terser({
              keep_classnames: true
            })
          : {},
        nodeResolve(),
        commonjs()
      ]
    }
  ];
};
