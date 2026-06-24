export default {
  title: 'Components/Input',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Headless text input — reads only `input.*` semantic tokens. Focus ring colour and corner radius change per brand.',
      },
    },
  },
};

export const Default = {
  name: 'Default',
  render: () => '<input class="input" type="text" placeholder="Enter your email…" style="max-width:320px;display:block;" />',
};

export const Filled = {
  name: 'Filled',
  render: () => '<input class="input" type="text" value="tamilarasan@example.com" style="max-width:320px;display:block;" />',
};

export const Disabled = {
  name: 'Disabled',
  render: () => '<input class="input" type="text" placeholder="Disabled" disabled style="max-width:320px;display:block;" />',
};

export const WithLabel = {
  name: 'With Label',
  render: () => `
    <div style="display:flex;flex-direction:column;gap:4px;max-width:320px;">
      <label style="font-size:var(--font-size-sm,14px);font-weight:var(--font-weight-medium,500);color:var(--input-fg,#111);">
        Email address
      </label>
      <input class="input" type="email" placeholder="you@example.com" />
    </div>
  `,
};
