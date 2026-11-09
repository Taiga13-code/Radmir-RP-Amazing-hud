import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import postcss, { type AtRule, type Rule } from 'postcss';

const HUD_ROOT = '#custom-radmir-hud-root';

function isInsideKeyframes(rule: Rule): boolean {
  const parent = rule.parent;
  return Boolean(
    parent &&
      parent.type === 'atrule' &&
      /(?:^|-)keyframes$/i.test((parent as AtRule).name),
  );
}

function scopeCss(css: string): string {
  const root = postcss.parse(css);

  root.walkRules((rule) => {
    if (isInsideKeyframes(rule)) {
      return;
    }

    const selectors: string[] = [];

    for (const raw of rule.selectors) {
      const selector = raw.trim();

      if (selector === 'html' || selector === 'body' || selector === '#root') {
        continue;
      }

      if (selector === HUD_ROOT || selector.startsWith(`${HUD_ROOT} `) || selector.startsWith(`${HUD_ROOT}:`)) {
        selectors.push(selector);
        continue;
      }

      selectors.push(`${HUD_ROOT} ${selector}`);
    }

    if (selectors.length === 0) {
      rule.remove();
      return;
    }

    rule.selectors = selectors;
  });

  return root.toString();
}

function inlineCss(): Plugin {
  return {
    name: 'inline-css-for-cohtml',
    apply: 'build',
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        let css = '';

        for (const [fileName, item] of Object.entries(bundle)) {
          if (item.type === 'asset' && fileName.endsWith('.css')) {
            css += typeof item.source === 'string' ? item.source : new TextDecoder().decode(item.source);
            delete bundle[fileName];
          }
        }

        if (css === '') {
          this.warn('inline-css-for-cohtml: no CSS asset found in the bundle');
        } else {
          css = scopeCss(css);
        }

        const polyfills =
          'function radmirPolyfill(){' +
          'if(typeof window.URLSearchParams!=="function"){' +
          'function US(init){this._m=[];var s=typeof init=="string"?init.replace(/^\\?/,""):"";' +
          'if(s){var p=s.split("&");for(var i=0;i<p.length;i++){if(!p[i]){continue;}var k=p[i],v="";var x=k.indexOf("=");' +
          'if(x>=0){v=k.slice(x+1);k=k.slice(0,x);}try{k=decodeURIComponent(k.replace(/\\+/g," "));}catch(pk){}' +
          'try{v=decodeURIComponent(v.replace(/\\+/g," "));}catch(pv){}this._m.push([k,v]);}}}' +
          'US.prototype.get=function(k){for(var i=0;i<this._m.length;i++){if(this._m[i][0]===k){return this._m[i][1];}}return null;};' +
          'US.prototype.getAll=function(k){var r=[];for(var i=0;i<this._m.length;i++){if(this._m[i][0]===k){r.push(this._m[i][1]);}}return r;};' +
          'US.prototype.has=function(k){return this.get(k)!==null;};' +
          'US.prototype.append=function(k,v){this._m.push([String(k),String(v)]);};' +
          'US.prototype.set=function(k,v){var f=false;for(var i=0;i<this._m.length;i++){if(this._m[i][0]===k){this._m[i][1]=String(v);f=true;}}if(!f){this.append(k,v);}};' +
          'US.prototype["delete"]=function(k){this._m=this._m.filter(function(p){return p[0]!==k;});};' +
          'US.prototype.forEach=function(cb,ctx){for(var i=0;i<this._m.length;i++){cb.call(ctx,this._m[i][1],this._m[i][0],this);}};' +
          'US.prototype.toString=function(){var r=[];for(var i=0;i<this._m.length;i++){r.push(encodeURIComponent(this._m[i][0])+"="+encodeURIComponent(this._m[i][1]));}return r.join("&");};' +
          'window.URLSearchParams=US;}' +
          'if(typeof window.queueMicrotask!=="function"){window.queueMicrotask=function(cb){Promise.resolve().then(cb);};}' +
          '}' +
          'try{radmirPolyfill();}catch(polyfillError){if(window.console){console.error("[RADMIR HUD] polyfill failed",polyfillError);}}';

        const injector =
          ';(function(){' +
          polyfills +
          `var css=${JSON.stringify(css)};` +
          'var id="radmir-custom-hud-style";' +
          'function apply(){' +
          'var host=document.head||document.documentElement;' +
          'if(!host){return false;}' +
          'var node=document.getElementById(id);' +
          'if(!node){node=document.createElement("style");node.id=id;node.type="text/css";host.appendChild(node);}' +
          'node.textContent=css;' +
          'return true;' +
          '}' +
          'if(!apply()){var attempts=0;var timer=window.setInterval(function(){if(apply()||++attempts>200){window.clearInterval(timer);}},50);}' +
          '})();';

        for (const item of Object.values(bundle)) {
          if (item.type === 'chunk' && item.isEntry) {
            item.code = injector + item.code;
          }
        }
      },
    },
  };
}

export default defineConfig({
  define: {
    __HUD_BUILD__: JSON.stringify(new Date().toISOString()),
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': '{}',
  },
  plugins: [react(), inlineCss()],
  build: {
    target: 'es2015',
    minify: 'esbuild',
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    emptyOutDir: false,
    rollupOptions: {
      external: [],
      output: {
        inlineDynamicImports: true,
      },
    },
    lib: {
      entry: 'src/main.tsx',
      name: 'RadmirHud',
      formats: ['iife'],
      fileName: () => 'hud.inject.js',
    },
  },
});
