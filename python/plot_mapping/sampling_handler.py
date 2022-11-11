from sampling import create_plot_maps


def handle_event(event):
    create_plot_maps(event['width'], event['height'], event['top'], event['left'],
                     event['bottom'], event['right'], sample_multi=event['sample_multi'],
                     f_doc=event['f_doc'], g_doc=event['g_doc'], h_doc=event['h_doc'],
                     seed=event['seed'])


handle_event({
    'width': 320,
    'height': 240,
    'top': 0.75,
    'left': -1.0,
    'right': 1.0,
    'bottom': -0.75,
    'sample_multi': 2.826,
    'f_doc': 'fB_320_240.proto',
    'g_doc': 'gB_320_240.proto',
    'h_doc': 'hB_320_240.proto',
    'seed': 27635
})
