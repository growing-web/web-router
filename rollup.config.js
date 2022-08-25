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
        ]
      : []),
    commonjs()
  ];

  const clientPlugins = [
    ...plugins,
    ...(isProduction
      ? [
          terser({
            keep_classnames: true
          })
        ]
      : []),
    nodeResolve()
  ];

  // TODO @worker-tools/html 打包后无法正常工作（它将 HTML 字符串都以实体输出了）
  const serverPlugins = [
    ...plugins
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
        },
        {
          file: 'dist/system/web-router.js',
          format: 'system',
          sourcemap: true
        }
      ],
      plugins: clientPlugins
    },
    {
      input: 'src/server/index.js',
      moduleContext(id) {
        return 'this';
      },
      output: [
        {
          file: 'dist/esm/web-router.server.js',
          format: 'esm',
          sourcemap: true
        }
      ],
      plugins: serverPlugins
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
      plugins: serverPlugins
    }
  ];
};
