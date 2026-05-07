import argparse
import base64
import json
import os
from pathlib import Path


def iter_files(root: Path):
    for dirpath, _, filenames in os.walk(root):
        for fn in filenames:
            p = Path(dirpath) / fn
            if p.is_file():
                yield p


def archive_folder(src_folder: Path, output_file: Path) -> None:
    src_folder = src_folder.resolve()
    payload = {}

    for file_path in iter_files(src_folder):
        rel = file_path.relative_to(src_folder).as_posix()
        data = file_path.read_bytes()
        payload[rel] = base64.b64encode(data).decode("ascii")

    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Archive a folder into a JSON mapping of relative paths to base64 content")
    parser.add_argument("srcfolder", help="Source folder to archive")
    parser.add_argument("output", help="Output archive file (json)")
    args = parser.parse_args()

    src = Path(args.srcfolder)
    out = Path(args.output)

    if not src.exists() or not src.is_dir():
        raise SystemExit(f"srcfolder must be an existing directory: {src}")

    archive_folder(src, out)


if __name__ == "__main__":
    main()
