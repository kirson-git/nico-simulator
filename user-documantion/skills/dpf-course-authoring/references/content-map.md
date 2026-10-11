# Teaching content to adapt from the l-csi guide

Use only the subjects that help the requested lesson. This is a content map,
not an instruction to build the whole guide into every course update.

| Subject | Useful teaching idea | Keep distinct |
| --- | --- | --- |
| DPU fundamentals | A network engine plus an independent Arm computer | Host OS, Arm OS, firmware, BMC |
| DPU vs NIC mode | Who controls the network engine? | Control ownership vs packet path; model support |
| SR-IOV | A PF creates VFs assigned to workloads | VF, representor, physical port, scalable function |
| DPF lifecycle | Provision, boot, join a cluster, deploy services | BFB installation vs an operational service |
| Kubernetes | Management controllers and DPU workers | Where API servers run vs where workload pods run |
| Tenancy | Europe/Asia control planes and example networks | Namespace labels vs enforced isolation |
| YAML to hardware | Connect each resource to its reconciler and effect | Management-cluster objects vs DPU service pods |
| Packet path | Trace a packet through named interfaces and policy | Logical diagram vs verified live forwarding |
| Desired architecture | Show intended trust/network boundaries | Target design vs deployed configuration |
| Diagnostics | Show useful symptoms and evidence for each phase | Recorded failures vs simulated scenarios |

The guide's OpenShell / DOCA Sentry / Tower / Argus material may support a later
policy lesson. It does not replace the existing DPF/HBN curriculum without a
user request. Likewise, a guide's example BMC address, firmware RC, or claimed
blocked component must not become a simulator default or current-status claim.

For each adapted YAML explanation, answer:

1. Where is this file applied?
2. Which controller reads it?
3. What observable state should change, and on which machine or cluster?
4. What is still required after it succeeds?

When no live evidence exists, label the result as an illustrative expected
outcome. Avoid converting a screenshot, animated arrow, or passed schema check
into a claim that the physical datapath works.
