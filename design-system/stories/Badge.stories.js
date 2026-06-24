export default {
  title: 'Components/Badge',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Headless badge — three variants via modifier classes (`.badge`, `.badge--success`, `.badge--error`). Border-radius is pill in Brand A, square in Brand B.',
      },
    },
  },
};

export const Default = {
  name: 'Default',
  render: () => '<span class="badge">Draft</span>',
};

export const Success = {
  name: 'Success',
  render: () => '<span class="badge badge--success">Published</span>',
};

export const Error = {
  name: 'Error',
  render: () => '<span class="badge badge--error">Failed</span>',
};

export const AllVariants = {
  name: 'All Variants',
  render: () => `
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
      <span class="badge">Draft</span>
      <span class="badge badge--success">Published</span>
      <span class="badge badge--error">Failed</span>
    </div>
  `,
};
