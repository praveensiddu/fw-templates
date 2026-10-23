# Requirements

## Goals

- Turn-key solution for any organization to offer self-service for application teams to provision firewall rules.
- A solution that integrates well within the organization's GitOps strategy if they already have one.
- DOR and SOL requirements to recertify the flows come standard.
- Any-day, any-time provisioning of firewall rules.

## Approach

- Opinionated.
- Green field.
- Separate provisioning from input.
- Provisioner should be as dumb as possible — all data required for provisioning is prepared and approved ahead of time.
- Protect against mess-ups.
- Periodic incremental / immediate reconciliation — feedback loop.
- Allow organizations to insert a gating mechanism — e.g., identification of unused and orphaned IP addresses.

## Access Control and Personas

- One application team must not be able to view or modify another team's products or firewall flows.
- Personas:
  - Security team
  - Application teams
  - Architects / center of expertise
- Personas are identified by groups, not individual users, to address JML (Joiner-Mover-Leaver) requirements:
  https://medium.com/@tsampatht1/identity-access-management-jml-process-navigating-the-joiner-mover-and-leaver-lifecycle-7e11aa811872
- No single person should be able to push a change to production. Peer review must be enforced.
- An organization may choose to enforce security team review.
- An organization may choose to enforce architecture team review.
- It will be good if flexibility is provided to configure these review gates.

## Data Model

- A product belongs to one and only one team.
- A team may have multiple products.
- A product will have a list of components.
- The components of a product may run on different data centers and different environments (dev, qa, prd, regression, and so on) and are bound to one and only one network area like DMZ, Serverfarm, or SharedServices.
- The group names used in the firewall must be made out of data center, environment, component name, and optionally an interface if there are multiple NIC cards on a VM (e.g., one northbound and another southbound).
- It is very typical for a component to belong to a common group (e.g., LINUX or WINDOWS groups), so groups may be shared across components.

## Usability

- Enforce naming conventions — be opinionated. For example:
  - No spaces in a component name.
  - No need to have a component specified in different cases.

## Organization Setup

- An organization should be able to specify their own:
  - Data center names and abbreviations
  - Environment names and abbreviations (dev, prd, qa, regression, testbed, ...)
  - Network segregations and their abbreviations within an environment-data-center, like DMZ, Backend, SharedServices
- The tool should come with some built-in predefined port-protocols that are already present in FortiMgr.
- Standardize the way to refer to port-protocol and translate before provisioning to the target firewall manager — FortiMgr, Palo Alto, and so on.

## Promotion Across Environments

- Application teams should be able to promote firewall rules that were tested in dev to qa, and qa to production.
- The only things that change between environments are the group names and the IP addresses.

## Inventory Feeds

- Use feeds from vCenter and other network discovery tools to provide human-understandable names like hostnames instead of IP addresses.
- When the user types in an IP address, the corresponding hostname must be shown.

## Prerequisites

- IP addresses are unique across the organization.

## Brownfield Onboarding

Feeds are ingested into the tool as YAML/CSV:

- CMDB → YAML/CSV → Tool
- IPAM (Infoblox) → YAML/CSV → Tool (e.g., to make sure applications do not use IP ranges that do not belong to them)
- DNS → YAML/CSV → Tool
- NetMRI → YAML/CSV → Tool
