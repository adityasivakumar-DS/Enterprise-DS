export default {
  title: 'Components/Button',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Headless button — reads only `action.primary.*` semantic tokens. Zero hardcoded values in `button.css`. Toggle Brand in the toolbar to compare.',
      },
    },
  },
};

export const Primary = {
  name: 'Primary',
  render: () => '<button class="btn">Get started</button>',
};

export const Disabled = {
  name: 'Disabled',
  render: () => '<button class="btn" disabled>Disabled</button>',
};

export const WithIcon = {
  name: 'With Icon',
  render: () => `
    <button class="btn">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"
           style="vertical-align:-1px;margin-right:6px;">
        <path d="M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1zm1 10V7.5H6.5v1H8V11H6v1h4v-1H8zm0-5.5a1 1 0 1 0-2 0 1 1 0 0 0 2 0z"/>
      </svg>
      Learn more
    </button>
  `,
};

export const AllStates = {
  name: 'All States',
  render: () => `
    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
      <button class="btn">Default</button>
      <button class="btn" disabled>Disabled</button>
    </div>
  `,
};
