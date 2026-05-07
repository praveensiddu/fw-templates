import argparse
import base64
import json
from pathlib import Path


def unarchive_file(archive_file: Path, output_folder: Path) -> None:
    archive_file = archive_file.resolve()
    output_folder = output_folder.resolve()

    data = json.loads(archive_file.read_text(encoding="utf-8") or "{}")
    if not isinstance(data, dict):
        raise SystemExit("Archive file must contain a JSON object mapping relative paths to base64 strings")

    output_folder.mkdir(parents=True, exist_ok=True)

    for rel, b64 in data.items():
        if not isinstance(rel, str) or not isinstance(b64, str):
            continue
        target = output_folder / Path(rel)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(base64.b64decode(b64.encode("ascii")))


def main() -> None:
    parser = argparse.ArgumentParser(description="Unarchive a JSON mapping of relative paths to base64 content into a folder")
    parser.add_argument("archive", help="Input archive file (json)")
    parser.add_argument("outputfolder", help="Output folder to write files into")
    args = parser.parse_args()

    archive = Path(args.archive)
    out = Path(args.outputfolder)

    if not archive.exists() or not archive.is_file():
        raise SystemExit(f"archive must be an existing file: {archive}")

    unarchive_file(archive, out)


if __name__ == "__main__":
    main()
