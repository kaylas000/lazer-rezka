#!/usr/bin/env node
/**
 * Design Validator — проверяет HTML/CSS на соответствие дизайн-системе lazer-rezka.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const DESIGN_TOKENS = {
  colors: {
    required: ['--bg-primary', '--bg-surface', '--bg-elevated', '--accent-orange', '--accent-light', '--accent-dark',
               '--text-primary', '--text-secondary', '--text-muted',
               '--border-subtle', '--border-default', '--border-accent',
               '--success', '--warning', '--error'],
    forbidden: ['#000000', '#ffffff', '#000', '#fff', 'rgb(0,0,0)', 'rgb(255,255,255)']
  },
  radius: {
    allowed: ['var(--radius-sm)', 'var(--radius-md)', 'var(--radius-lg)', '8px', '12px', '16px',
              '14px', '10px', '6px', '4px', '50%', '100%', '0', '9999px']
  },
  fonts: {
    base: 'var(--font-base)',
    display: 'var(--font-display)',
    forbiddenRaw: ['Arial', 'Helvetica', 'Times New Roman', 'Georgia']
  },
  spacing: {
    minTouchTarget: 44, // px
    maxWidth: 1280
  }
};

const RULES = {
  // Critical errors (exit 1)
  critical: [
    {
      id: 'no-tokens',
      check: (content) => {
        let found = DESIGN_TOKENS.colors.required.filter(t => content.includes(t));
        // Require at least 8 of 14 tokens present
        if (found.length < 8) {
          let missing = DESIGN_TOKENS.colors.required.filter(t => !content.includes(t));
          return `Only ${found.length}/14 design tokens used. Missing: ${missing.slice(0,5).join(', ')}...`;
        }
        return null;
      }
    },
    {
      id: 'btn-no-min-height',
      check: (content) => {
        let btnDefs = content.match(/\.btn[^{]*\{[^}]*\}/g) || [];
        let bad = btnDefs.filter(b => !b.includes('min-height') && (b.includes('padding:') || b.includes('padding:')));
        return bad.length > 0 ? `${bad.length} button(s) without min-height 44px` : null;
      }
    },
    {
      id: 'font-size-too-small',
      check: (content) => {
        let small = [];
        let re = /font-size:\s*(\d+)px/g;
        let m;
        while ((m = re.exec(content)) !== null) {
          if (parseInt(m[1]) < 12) small.push(m[0]);
        }
        return small.length > 0 ? `${small.length} font-size declarations below 12px` : null;
      }
    },
    {
      id: 'missing-font-family',
      check: (content) => {
        // Check for text-containing elements without font-family
        let bodyMatch = content.match(/body\s*\{[^}]*\}/);
        if (bodyMatch && !bodyMatch[0].includes('font-family')) return 'body missing font-family';
        return null;
      }
    }
  ],

  // Warnings
  warnings: [
    {
      id: 'raw-colors',
      check: (content) => {
        let raw = content.match(/(#[0-9a-fA-F]{3,6}|rgba?\([^)]+\))/g) || [];
        // Filter out design token values themselves
        let suspicious = raw.filter(c => {
          let lower = c.toLowerCase();
          return !['#ff6b2b', '#ff8c55', '#e55a1f', '#0b0b0f', '#16161f', '#1e1e2e',
                   '#22c55e', '#f59e0b', '#ef4444', 'rgba(255,255,255',
                   'rgba(0,0,0', 'rgba(255,107,43'].some(t => lower.startsWith(t.toLowerCase()));
        });
        return suspicious.length > 8 ? `${suspicious.length} raw color values — prefer CSS variables` : null;
      }
    },
    {
      id: 'inline-styles',
      check: (content) => {
        let inlineCount = (content.match(/style="/g) || []).length;
        return inlineCount > 5 ? `${inlineCount} inline style attributes — move to CSS classes` : null;
      }
    },
    {
      id: 'px-spacing',
      check: (content) => {
        let pxSpacing = content.match(/(padding|margin|gap):\s*\d+px/g) || [];
        return pxSpacing.length > 40 ? `${pxSpacing.length} px spacing values — consider design tokens (baseline: main.css=370)` : null;
      }
    },
    {
      id: 'desktop-first-media',
      check: (content) => {
        let maxWidthQueries = (content.match(/@media\s*\(max-width:/g) || []).length;
        let minWidthQueries = (content.match(/@media\s*\(min-width:/g) || []).length;
        if (maxWidthQueries > 0 && minWidthQueries === 0) return 'Only max-width queries found — consider mobile-first with min-width';
        return null;
      }
    },
    {
      id: 'responsive-missing',
      check: (content) => {
        let hasMedia = content.includes('@media');
        let hasContainer = content.includes('max-width');
        return (!hasMedia && hasContainer) ? 'No @media queries — page may not be responsive' : null;
      }
    },
    {
      id: 'touch-target',
      check: (content) => {
        // Check for small interactive elements
        let smallBtns = [];
        let btnRe = /\.\w*btn\w*[^{]*\{[^}]*\}|button[^{]*\{[^}]*\}|\[type="button"\]\s*\{[^}]*\}/g;
        let bm;
        while ((bm = btnRe.exec(content)) !== null) {
          let block = bm[0];
          if ((block.includes('padding:') || block.includes('height:')) && !block.includes('min-height')) {
            let hMatch = block.match(/height:\s*(\d+)px/);
            let pMatch = block.match(/padding:\s*(\d+)px\s+(\d+)px/);
            if (hMatch && parseInt(hMatch[1]) < 44) smallBtns.push(hMatch[0]);
            else if (pMatch && (parseInt(pMatch[1]) * 2 + 16) < 44) smallBtns.push(pMatch[0]);
          }
        }
        return smallBtns.length > 0 ? `${smallBtns.length} interactive elements below 44px touch target` : null;
      }
    }
  ]
};

function validate(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  let criticalErrors = [];
  let warnings = [];

  for (let rule of RULES.critical) {
    let err = rule.check(content);
    if (err) criticalErrors.push(`[${rule.id}] ${err}`);
  }

  for (let rule of RULES.warnings) {
    let warn = rule.check(content);
    if (warn) warnings.push(`[${rule.id}] ${warn}`);
  }

  // Report
  console.log(`\n=== Design Validator: ${path.basename(filePath)} ===\n`);

  if (criticalErrors.length > 0) {
    console.log(`CRITICAL (${criticalErrors.length}):`);
    criticalErrors.forEach(e => console.log(`  ❌ ${e}`));
  }

  if (warnings.length > 0) {
    console.log(`\nWARNINGS (${warnings.length}):`);
    warnings.forEach(w => console.log(`  ⚠️  ${w}`));
  }

  let total = criticalErrors.length + warnings.length;
  if (total === 0) {
    console.log('  ✅ ALL CHECKS PASSED');
  }

  console.log(`\n  Total: ${criticalErrors.length} critical, ${warnings.length} warnings`);

  return criticalErrors.length === 0 ? 0 : 1;
}

// Run
let filePath = process.argv[2] || path.join(__dirname, '..', 'pages', 'dxf-generator.html');
let exitCode = validate(filePath);
process.exit(exitCode);
