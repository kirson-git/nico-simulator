# NICo Simulator

An interactive, hardware-free course for learning NVIDIA BlueField DPUs and
DPF. Explore diagrams, inspect complete YAML examples, rehearse host Ubuntu
installation, and practice Kubernetes commands in a dedicated local cluster.

The course keeps all topics in the left sidebar, with explanations and exercises
on the right. Lessons and YAMLs are prepared in advance; learners do not need to
edit files to follow them.

## Included lessons

| Lesson | What you can do |
| --- | --- |
| DPU 101 | Learn what is inside a DPU and how its OS differs from the host OS. |
| DPU vs NIC mode | Play, pause and step through control ownership and packet flow. |
| OS → containers | Follow BFB provisioning, Arm Linux boot, cluster join and services. |
| Manual DPU → HBN | Practice Linux-style commands from an existing Arm OS through BFB, HBN and host restrictions. |
| BF4 installation differences | Compare BFB/RShim with BF4 BMC, ISO and PLDM flows, then inspect the NICo/DPF configuration. |
| Kubernetes basics | Use a real Bash terminal, apply a prepared Europe example, check progress and reset the exercise. |
| DPU configuration | Inspect eight complete YAMLs and see what each field affects. |
| Host Ubuntu | Rehearse virtual ISO mounting and an automatic installation in the browser. |

The concept lessons, manual DPU CLI, YAML walkthrough and host installation are
simulations. The manual DPU lesson uses authored fixtures, supports transcript
export, and requires no real DPU login. See the
[manual lesson guide](user-documantion/manual-dpu.txt).
The Kubernetes exercise runs real commands against an isolated two-node **kind**
cluster. This course does not install DPF, provision physical DPUs, mount an ISO
on a real server, or deploy HBN. Additional hands-on lessons are marked **Planned**.

The hardware introduction discusses BlueField-4. The manual BFB/HBN exercise
uses a BlueField-3 profile, with a BF4 compatibility explanation on the lesson page.
The prepared DPF 26.4 YAMLs
are teaching copies from a BlueField-3 lab; this is not a BlueField-4 deployment
compatibility claim. The original uploaded diagrams remain unchanged, with
nearby explanations of their historical labels.

## Installation options

| Option | Availability | Where it runs |
| --- | --- | --- |
| [Local Linux installation](#local-linux-installation) | Supported: Linux x86-64 / amd64 | Docker and the training cluster run on your own machine. |
| [NVIDIA Brev](#nvidia-brev-planned) | Planned for the completed simulator | A dedicated cloud VM with a shareable Launchable. |
| Native macOS / Apple Silicon / Windows | Not implemented in this launcher | Docker Desktop alone does not make this Linux-only launcher compatible. |

No physical DPU, GPU, existing Kubernetes cluster, or NVIDIA credentials are
required for the local simulator. The first build and start need internet access.
The repository builds its container image locally; there is no published image
or ready-to-use Brev launch button in this release.

## Local Linux installation

Run these commands on the **Linux machine where you will open the browser**.
Use the same Linux account and checkout for subsequent starts and updates.

### 1. Prepare the machine

| Requirement | Purpose |
| --- | --- |
| Linux x86-64 (`uname -sm` shows `Linux x86_64`) | Architecture supported by the launcher and image. |
| Docker Engine with Buildx | Builds the course image and runs the course and kind nodes. |
| Git, Bash, curl and Python 3 | Downloads sources and runs the launcher. |
| kubectl in `PATH` | Prepares access to the dedicated training cluster. |
| Available local port 8780 | Browser entrypoint. |

The launcher downloads its pinned kind binary automatically. Node.js, npm, Helm,
Vim and the browser terminal dependencies are installed inside the course image;
you do not need to install those on the host. Allow capacity for a Docker image
build and two kind nodes in addition to the course container's 2-CPU / 1-GiB limit.
That container limit is not a minimum size for the whole machine.

On Ubuntu, install the basic tools if missing:

```bash
sudo apt-get update
sudo apt-get install -y git curl ca-certificates python3
```

If Docker is missing, follow the
[official Docker Engine installation guide for Ubuntu](https://docs.docker.com/engine/install/ubuntu/).
For another Linux distribution, use its corresponding Docker installation guide.
Your account must be able to run `docker info` successfully. Docker documents
[Linux account access setup](https://docs.docker.com/engine/install/linux-postinstall/);
membership in the Docker group grants root-level privileges.

If kubectl is missing, follow the
[official kubectl installation guide](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/).
The workshop pins Kubernetes v1.35.8; kubectl v1.35.8 matches the client bundled
inside its image. Installing kubectl does not require an existing cluster.

Check the prerequisites before continuing:

```bash
uname -sm
git --version
bash --version
curl --version
python3 --version
docker info
docker buildx version
kubectl version --client
```

### 2. Download the simulator

```bash
git clone https://github.com/kirson-git/nico-simulator.git
cd nico-simulator
```

If GitHub requests authentication, use an account with access to the repository.
For an existing checkout, skip cloning and use [Update the simulator](#update-the-simulator).

### 3. Build and start

```bash
./workshop.sh --build
./workshop.sh --start
./workshop.sh --status
```

Wait for `Workshop ready: http://127.0.0.1:8780`. Status should show the course
container running and both training nodes as `Ready`.

The start command creates a dedicated two-node `kind-dpf-training` cluster and
starts the course container. Lessons and prepared examples are already included.

### 4. Open the course

Open these links in a browser on the same Linux machine:

| Lesson | Local address |
| --- | --- |
| Start with DPU 101 | [localhost:8780](http://localhost:8780/) |
| DPU vs NIC mode | [/#modes](http://localhost:8780/#modes) |
| OS first, then containers | [/#software](http://localhost:8780/#software) |
| Manual DPU → HBN | [/manual-dpu](http://localhost:8780/manual-dpu) |
| Kubernetes exercise | [/kubernetes](http://localhost:8780/kubernetes) |
| DPU YAML walkthrough | [/dpu-config](http://localhost:8780/dpu-config) |
| Host Ubuntu rehearsal | [/host-ubuntu](http://localhost:8780/host-ubuntu) |

`localhost` means the computer running your browser. The `#software` part selects
a lesson in the course; it is not a GitHub directory. Keep the Docker service
running while using the simulator. Closing the setup terminal does not stop the
containers.

## NVIDIA Brev (planned)

Brev will be an additional distribution option for the completed simulator.
NVIDIA documents how to package code, an environment and compute settings into a
shareable [Brev Launchable](https://docs.nvidia.com/brev/concepts/launchables).
Start with the [NVIDIA Brev overview](https://docs.nvidia.com/brev/getting-started/overview)
to learn about the platform.

The proposed integration uses a Linux amd64 VM to build and start this workshop,
including its dedicated kind cluster. A simulator Launchable has not been
published or tested on Brev. The local application accepts only localhost
origins; authenticated browser access through Brev must be implemented and
verified before advertising that option as ready to use.

Once validated, this section will include the actual **Launch on Brev** button
and user instructions. Use the local Linux installation above for this release.

## Update the simulator

From your existing checkout, with no uncommitted local changes:

```bash
git pull --ff-only
./workshop.sh --build
./workshop.sh --start
./workshop.sh --status
```

The course container is replaced. The owned training cluster and learner
workspace are retained. Reload the browser to load updated lessons.

## Manage the workshop

Run exactly one flag per invocation. No argument or `--help` prints help;
unknown flags and multiple arguments exit with an error.

| Command | Behavior |
| --- | --- |
| `./workshop.sh --build` | Build the pinned `dpf-workshop:0.1.0` container image. |
| `./workshop.sh --start` | Create or reuse the owned training cluster; start or replace the course container. Preserve learner files. |
| `./workshop.sh --status` | Show the course container and training nodes; fail if the course container is absent. |
| `./workshop.sh --logs` | Print server logs, including automated Kubernetes commands and results. |
| `./workshop.sh --stop` | Stop the course container; retain the cluster and workspace. |
| `./workshop.sh --delete-cluster` | Remove this workshop container and owned kind cluster; retain the learner workspace volume. |
| `./workshop.sh --help` | Show supported flags and requirements. |

Host command logs and the private training kubeconfig live in `.runtime/`, which
is excluded from Git and Docker builds. Server logs record automated operations;
they are not a complete transcript of arbitrary commands typed in the terminal.
The browser's Kubernetes reset deletes only the `tenant-europe` exercise namespace
and restores its prepared YAML inside the training environment.

Use one checkout per Docker host: the launcher uses fixed container, cluster,
volume and port names. Keep `.runtime/` with the checkout when moving an existing
local installation. A fresh clone refuses to take over an existing cluster whose
identity it does not own. Never commit that runtime directory.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Browser cannot open the course | Run `./workshop.sh --status` and `./workshop.sh --logs`. Open the browser on the machine running Docker. |
| `Missing required tool` | Install the named host prerequisite, then run `--start` again. |
| Docker permission denied | Check account access using `docker info` and the Docker post-installation guide above. |
| `Run --build first` | Run `./workshop.sh --build` successfully before `--start`. |
| Port 8780 already in use | Check `docker ps` and `ss -ltnp 'sport = :8780'`; stop the conflicting service only if it is yours. This launcher has no alternate-port flag. |
| Training cluster identity does not match | Use the original checkout with its `.runtime/` ownership record. Do not delete or overwrite an unfamiliar cluster. |
| `This release supports Linux amd64` | Use a Linux x86-64 machine; native macOS and ARM64 execution are not supported. |
| A topic says **Planned** | That exercise is not implemented; use one of the available lesson links above. |

## Course authoring

```text
web/                         Lessons, navigation, diagrams, fonts and exact PNGs
examples/dpf/                Prepared YAML sources and original-file provenance
lessons/                     Runnable Kubernetes exercise
bin/build-yaml-examples.py    Build the YAML bundle used by the browser
server.mjs                   HTTP server and browser terminal bridge
lesson.mjs                   Training cluster validation and exercise grading
tests/                       Unit, launcher lifecycle and browser checks
user-documantion/            Authoring skill, testing guide and migration notes
workshop.sh                  Docker/kind lifecycle commands
```

To update a YAML walkthrough, edit the corresponding prepared file under
`examples/dpf/`, then regenerate the browser bundle:

```bash
python3 bin/build-yaml-examples.py
```

The examples contain fictional IPs and DPU identities. `manifest.json` retains
historical source paths and hashes; those original lab files are not required
and are not included. The bundle also records each local training source/hash.
These examples are for inspection, not deployment as-is to a physical lab.

Follow [AGENTS.md](AGENTS.md) and the
[DPF course-authoring skill](user-documantion/skills/dpf-course-authoring/SKILL.md).
Keep the short lessons, original PNGs, readable animations and complete prepared
YAMLs. Explain what each YAML affects and distinguish simulated results from
recorded evidence. Add new browser assets to the explicit allowlist in `server.mjs`.

## Verification

After building the image:

```bash
docker run --rm --entrypoint npm dpf-workshop:0.1.0 test
python3 -m unittest discover -s tests -p 'test_*.py'
bash -n workshop.sh
```

See [the testing guide](user-documantion/testing.txt) for browser checks.

## Access and attribution

The service binds to `127.0.0.1:8780` and accepts localhost browser origins.
It is a single-learner workshop with a real shell and no web login; keep it on
loopback rather than exposing it publicly.
Its container receives only the training kubeconfig, not the host Docker socket
or your administration kubeconfig.

The terminal bridge is adapted from
[k8s-101-launchable](https://github.com/ansjindal/k8s-101-launchable).
See [THIRD_PARTY_NOTICES.txt](THIRD_PARTY_NOTICES.txt) for its MIT notice.
Bundled images and fonts retain their respective owners' rights; this repository
does not grant additional rights to those assets. This is a learning project,
not an official NVIDIA product.
