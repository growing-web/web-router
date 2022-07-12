/* eslint-disable import/no-dynamic-require, global-require */
/* global process */
import { terser } from 'rollup-plugin-terser';
import replace from '@rollup/plugin-replace';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import minifyHTML from 'rollup-plugin-minify-html-literals';

export default () => {
  const isProduction = process.env.NODE_ENV !== 'development';
  const plugins = [
    replace({
      preventAssignment: true,
      values: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || '')
      }
    }),
    ...(isProduction
      ? [
          minifyHTML(),
          terser({
            keep_classnames: true
          })
        ]
      : []),
    nodeResolve(),
    commonjs()
  ];

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
      plugins
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
      plugins
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
      plugins
    }
  ];
};
