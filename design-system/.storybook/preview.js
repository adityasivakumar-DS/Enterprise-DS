import '../build/css/blue.css';
import '../build/css/dark.css';
import '../components/button.css';
import '../components/input.css';
import '../components/card.css';
import '../components/badge.css';

export const globalTypes = {
  brand: {
    name: 'Brand',
    description: 'Active brand theme',
    defaultValue: 'blue',
    toolbar: {
      icon: 'paintbrush',
      items: [
        { value: 'blue', title: 'Brand A — Blue Rounded' },
        { value: 'dark', title: 'Brand B — Black Sharp' },
      ],
      showName: true,
    },
  },
};

export const decorators = [
  (story, context) => {
    const brand = context.globals.brand ?? 'blue';
    return `<div data-brand="${brand}" style="padding:32px;background:var(--surface-page,#fff);min-height:100px;">${story()}</div>`;
  },
];

export const parameters = {
  backgrounds: { disable: true },
  layout: 'fullscreen',
};
