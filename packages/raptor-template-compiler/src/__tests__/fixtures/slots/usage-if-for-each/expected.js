import _aB from 'a-b';
export default function tmpl($api, $cmp, $slotset, $ctx) {
    const {
        t: api_text,
        h: api_element,
        i: api_iterator,
        c: api_custom_element
    } = $api;

    return [
        api_custom_element('a-b', _aB, {
            classMap: {
                s2: true
            },
            slotset: {
                $default$: $cmp.isTrue
                    ? api_iterator($cmp.items, function(item) {
                          return api_element('p', {}, [api_text('X')]);
                      })
                    : []
            }
        })
    ];
}