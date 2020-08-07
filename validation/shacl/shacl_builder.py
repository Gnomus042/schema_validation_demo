import os
import re
import json


def pack():
    shacls = [open('base.shacl').read()]
    for file in os.listdir('shapes'):
        shacls.append(open(f'shapes/{file}').read())

    # for dir in os.listdir('specific'):
    #     for file in os.listdir(f'specific/{dir}'):
    #         shacls.append(open(os.path.join('specific', dir, file)).read())
    full = fill_temp_holes('\n\n\n'.join(shacls))
    open('full.shacl', 'w').write(full)


def find_unknown():
    defined_shapes = set([shex_file[:-6] for shex_file in os.listdir('shapes')])
    unknown = set()
    for shacl_file in os.listdir('shapes'):
        shape = open(f'shapes/{shacl_file}').read()
        links = set(re.findall("sh:node :(.*?)[ \]][;\n]", shape))

        unknown = unknown.union(links.difference(defined_shapes))
    return sorted(list(unknown))


def fill_temp_holes(shacl):
    holes = find_unknown()
    for hole in holes:
        shacl = shacl.replace(f'sh:node :{hole}', f'sh:class schema:{hole}')
    return shacl


if __name__ == '__main__':
    pack()
