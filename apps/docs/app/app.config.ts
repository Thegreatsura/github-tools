export default defineAppConfig({
  name: 'GitHub Tools',
  description: 'AI-callable GitHub tools for the Vercel AI SDK — presets, agents, durable workflows, and granular write approvals for production use.',
  landing: false,
  socials: {
    x: 'https://x.com/hugorcd',
  },
  seo: {
    titleTemplate: '%s - GitHub Tools',
    title: 'GitHub Tools',
    description: 'AI-callable GitHub tools for the Vercel AI SDK — presets, agents, durable workflows, and granular write approvals for production use.',
  },
  github: {
    rootDir: 'apps/docs',
    url: 'https://github.com/vercel-labs/github-tools',
  },
  assistant: {
    icons: {
      trigger: 'i-custom:ai',
    },
    faqQuestions: [
      {
        category: 'Get started',
        items: [
          'How do I add GitHub tools to my AI app?',
          'Which preset should I use for my use case?',
          'What can the 42 tools actually do?',
        ],
      },
      {
        category: 'Build agents',
        items: [
          'How do I build a GitHub agent with eve?',
          'How do I build a PR review bot that responds to @mentions?',
          'When should I use createGithubAgent vs raw createGithubTools?',
        ],
      },
      {
        category: 'Go to production',
        items: [
          'How do I make my agent survive crashes and timeouts?',
          'How do I stream a durable agent to a chat UI?',
          'How do I reduce token usage when the model sees 42 tools?',
        ],
      },
      {
        category: 'Safety & auth',
        items: [
          'How do I require human approval before the agent merges a PR?',
          'Can I approve a write once and auto-allow it for the rest of the session?',
          'How do I use Vercel Connect instead of a personal access token?',
        ],
      },
      {
        category: 'Customize',
        items: [
          'How do I credit my bot as co-author on commits?',
          'How do I override a tool description or approval per tool?',
          'How do I cherry-pick only the tools I need?',
        ],
      },
    ],
  },
  ui: {
    colors: {
      primary: 'neutral',
      neutral: 'neutral',
    },
    header: {
      slots: {
        root: 'bg-default border-b border-default/50 h-(--ui-header-height) sticky top-0 z-50',
      },
    },
    pageHeader: {
      slots: {
        root: 'relative py-10 sm:py-12',
        title: 'text-4xl sm:text-5xl font-normal tracking-tight text-pretty text-highlighted',
        description: 'text-lg font-normal text-toned mt-4',
        headline: 'text-sm text-muted font-normal mb-3',
      },
    },
    contentToc: {
      defaultVariants: {
        highlightVariant: 'straight',
      },
      slots: {
        trigger: 'text-sm font-normal text-highlighted',
        link: 'text-sm font-normal py-1',
      },
      variants: {
        active: {
          false: {
            link: 'text-muted hover:text-highlighted',
          },
        },
      },
    },
    contentNavigation: {
      defaultVariants: {
        variant: 'link',
        color: 'neutral',
      },
      slots: {
        trigger: 'font-normal',
        link: 'font-normal',
      },
      variants: {
        active: {
          false: {
            link: 'text-toned hover:text-highlighted',
          },
        },
      },
    },
    contentSurround: {
      slots: {
        linkTitle: 'font-normal text-[15px] text-highlighted mb-1 truncate',
      },
    },
    prose: {
      h1: {
        slots: {
          base: 'font-normal',
        },
      },
      h2: {
        slots: {
          base: 'font-normal',
        },
      },
      h3: {
        slots: {
          base: 'font-normal',
        },
      },
      h4: {
        slots: {
          base: 'font-normal',
        },
      },
      a: {
        base: 'font-normal',
      },
      li: {
        base: 'font-normal',
      },
      th: {
        base: 'font-normal',
      },
      prompt: {
        slots: {
          root: 'relative flex flex-wrap items-center gap-2 border border-default bg-muted rounded-lg px-4 py-3 my-5 last:mb-0',
        },
      },
      p: {
        slots: {
          root: 'text-base/7 font-normal text-toned',
        },
      },
    },
    pageFeature: {
      slots: {
        root: 'relative rounded-sm py-2',
        title: 'text-base/7 text-pretty font-normal text-highlighted',
        description: 'mt-1 text-[15px]/7 font-normal text-pretty text-muted',
      },
      variants: {
        orientation: {
          horizontal: {
            root: 'mb-3 flex items-start gap-3',
          },
        },
      },
    },
  },
  footer: {
    sections: [
      {
        title: 'Getting Started',
        links: [
          { label: 'Introduction', to: '/getting-started/introduction' },
          { label: 'Installation', to: '/getting-started/installation' },
          { label: 'Quick Start', to: '/getting-started/quick-start' },
          { label: 'Agent Skills', to: '/getting-started/agent-skills' },
        ],
      },
      {
        title: 'Frameworks',
        links: [
          { label: 'eve', to: '/frameworks/eve' },
          { label: 'AI SDK', to: '/frameworks/ai-sdk' },
          { label: 'Vercel Workflow', to: '/frameworks/vercel-workflow' },
          { label: 'Chat SDK', to: '/frameworks/chat-sdk' },
        ],
      },
      {
        title: 'Guides',
        links: [
          { label: 'Presets', to: '/guide/presets' },
          { label: 'Approval Control', to: '/guide/approval-control' },
          { label: 'Commit Attribution', to: '/guide/commit-attribution' },
          { label: 'Tokens & Auth', to: '/guide/tokens-and-auth' },
          { label: 'Examples', to: '/guide/examples' },
        ],
      },
      {
        title: 'API',
        links: [
          { label: 'Tools Catalog', to: '/api/tools-catalog' },
          { label: 'API Reference', to: '/api/reference' },
        ],
      },
      {
        title: 'Resources',
        links: [
          { label: 'GitHub', to: 'https://github.com/vercel-labs/github-tools' },
          { label: 'npm', to: 'https://www.npmjs.com/package/@github-tools/sdk' },
          { label: 'Agent Skills', to: '/getting-started/agent-skills' },
        ],
      },
    ],
  },
})
