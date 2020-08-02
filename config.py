supported_services = ['Google', 'Bing', 'Pinterest', 'Yandex']

tests_path = 'validation/tests'

shex_path = 'validation/shex'
shacl_path = 'validation/shacl'

allowed_for_validation = {
    "shex": {
        "Dataset": ["Google"],
        "Recipe": ["Google", "Bing", "Yandex", "Pinterest"]
    },
    "shacl": {
        "Dataset": [],
        "Recipe": ["Google", "Bing", "Yandex", "Pinterest"]
    }
}
