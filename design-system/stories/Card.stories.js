export default {
  title: 'Components/Card',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Headless card container — reads only `card.*` semantic tokens. Radius and shadow differ between brands.',
      },
    },
  },
};

export const Default = {
  name: 'Default',
  render: () => `
    <div class="card" style="max-width:360px;">
      <p class="card-title">Design tokens</p>
      <p class="card-body">One source of truth for every brand property. Change a value, update everywhere.</p>
    </div>
  `,
};

export const WithAction = {
  name: 'With Action',
  render: () => `
    <div class="card" style="max-width:360px;">
      <p class="card-title">Get started</p>
      <p class="card-body">Theme a new brand in minutes using the parametric token system.</p>
      <div style="margin-top:16px;">
        <button class="btn">Open docs</button>
      </div>
    </div>
  `,
};

export const Grid = {
  name: 'Card Grid',
  render: () => `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;max-width:760px;">
      <div class="card">
        <p class="card-title">Token pipeline</p>
        <p class="card-body">Style Dictionary v4 converts DTCG JSON into scoped CSS variables per brand.</p>
      </div>
      <div class="card">
        <p class="card-title">Headless components</p>
        <p class="card-body">Components contain zero hardcoded values — only semantic CSS variable references.</p>
      </div>
    </div>
  `,
};
