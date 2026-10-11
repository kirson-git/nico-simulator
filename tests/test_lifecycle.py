"""Exercise the Bash entrypoint with a controlled Docker/kind boundary."""
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


class LifecycleTests(unittest.TestCase):
    def run_delete(self, saved_id):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            shutil.copyfile(Path(__file__).parents[1] / "workshop.sh", root / "workshop.sh")
            state = root / ".runtime"
            state.mkdir()
            (state / "owned-cluster").write_text(saved_id + "\n")
            fakebin = root / "fakebin"
            fakebin.mkdir()
            docker = fakebin / "docker"
            docker.write_text("""#!/bin/bash
printf 'docker %s\\n' "$*" >> "$EVENTS"
case "$1" in
  inspect)
    case "$*" in
      *Config.Labels*) echo dpf-training;;
      *--format*) echo actual-cluster-id;;
    esac;;
  logs) echo 'AUDIT: previous check command completed';;
esac
""")
            kind = state / "kind"
            kind.write_text('#!/bin/bash\nprintf "kind %s\\n" "$*" >> "$EVENTS"\n')
            checksum = fakebin / "sha256sum"
            checksum.write_text("#!/bin/bash\ncat >/dev/null\nexit 0\n")
            for path in (docker, kind, checksum):
                path.chmod(0o700)
            events = root / "events"
            result = subprocess.run(
                ["bash", str(root / "workshop.sh"), "--delete-cluster"],
                env={**os.environ, "PATH": str(fakebin) + ":" + os.environ["PATH"], "EVENTS": str(events)},
                text=True, capture_output=True, timeout=10,
            )
            logs = "\n".join(path.read_text() for path in (state / "logs").glob("*.log") if path.is_file() and not path.is_symlink())
            return result, events.read_text(), logs

    def test_stale_owner_record_cannot_delete_replacement_cluster(self):
        result, events, _ = self.run_delete("old-cluster-id")
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn("kind delete", events)
        self.assertNotIn("docker rm", events)

    def test_owned_cluster_cleanup_preserves_server_command_history(self):
        result, events, logs = self.run_delete("actual-cluster-id")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("AUDIT: previous check command completed", logs)
        self.assertLess(events.index("docker logs"), events.index("docker rm"))
        self.assertIn("kind delete cluster --name dpf-training", events)

    def test_interrupted_download_does_not_poison_the_kind_cache(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            shutil.copyfile(Path(__file__).parents[1] / "workshop.sh", root / "workshop.sh")
            fakebin = root / "fakebin"
            fakebin.mkdir()
            for name, body in {
                "docker": "exit 0",
                "kubectl": "exit 0",
                "curl": 'while (($#)); do if [[ $1 == -o ]]; then printf partial > "$2"; break; fi; shift; done; exit 22',
            }.items():
                path = fakebin / name
                path.write_text("#!/bin/bash\n" + body + "\n")
                path.chmod(0o700)
            result = subprocess.run(["bash", str(root / "workshop.sh"), "--start"],
                env={**os.environ, "PATH": str(fakebin) + ":" + os.environ["PATH"]},
                text=True, capture_output=True, timeout=10)
            self.assertNotEqual(result.returncode, 0)
            self.assertFalse((root / ".runtime/kind").exists())


if __name__ == "__main__":
    unittest.main()
