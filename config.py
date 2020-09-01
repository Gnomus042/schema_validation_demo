supported_services = ['Google', 'Bing', 'Pinterest', 'Yandex']

tests_path = 'validation/tests'

shex_path = 'validation/shex'
shacl_path = 'validation/shacl'

allowed_for_validation = {
    "shex": {
        "Google": ["Google"],
        "Recipe": ["Google", "Bing", "Yandex", "Pinterest"]
    },
    "shacl": {
        "Google": [],
        "Recipe": ["Google", "Bing", "Yandex", "Pinterest"]
    }
}

hierarchy = {
    'service': '',
    'serviceName': 'Schema',
    'nested': [
        {
            'service': 'Google',
            'nested': [
                {
                    'service': 'GoogleProduct1'
                },
                {
                    'service': 'GoogleProduct2'
                },
                {
                    'service': 'GoogleProduct3'
                }
            ]
        },
        {
            'service': 'Bing'
        },
        {
            'service': 'Yandex'
        },
        {
            'service': 'Pinterest'
        }
    ]
}