// narrative-config.js - Shared narrative + featured project settings
(function() {
  window.MapAppConfig = window.MapAppConfig || {};

  const narrativePassages = [
    {
      id: 'borderless-earth',
      title: 'In space, there are no borders.',
      text: 'From this perspective, Earth is whole. No walls divide it. No lines separate it. Just one planet, turning beneath endless stars.',
      holdDurationMs: 4000,
      featuredProjectId: 'project-1-the-place-where-clouds-are-for'
    },
    {
      id: 'stories-below',
      title: 'But below...',
      text: 'Below are stories. Stories of people who cross lines. Who create art and music and research. Who build communities despite walls.',
      holdDurationMs: 4000,
      featuredProjectId: 'project-8-undergraduate-internship-progr'
    },
    {
      id: 'borderlands-focus',
      title: 'The Arizona-Sonora Borderlands',
      text: 'This is where our story begins. Where borders and cultures collide, merge, and create something entirely new.',
      holdDurationMs: 3000,
      featuredProjectId: 'project-19-online-collaboration-and-acade'
    }
  ];

  window.MapAppConfig.narrative = {
    passages: narrativePassages,
    characterIntervalMs: 50
  };

  window.MapAppConfig.featuredProjects = {
    explore: [
      'project-1-the-place-where-clouds-are-for',
      'project-37-creating-emancipatory-spaces-t',
      'project-19-online-collaboration-and-acade',
      'project-8-undergraduate-internship-progr'
    ]
  };
})();
