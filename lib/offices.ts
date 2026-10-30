import type { Office, OfficeInput, OfficePayload } from "@/types/offices"

export function emptyOfficeInput(companyUuid = ""): OfficeInput {
  return {
    company_uuid: companyUuid,
    office_code: "",
    name: "",
    address: "",
    phones: [""],
    note: "",
  }
}

export function toOfficeInput(office: Office): OfficeInput {
  return {
    company_uuid: office.company_uuid,
    office_code: office.office_code.toUpperCase(),
    name: office.name,
    address: office.address,
    phones: office.phones.length ? office.phones : [""],
    note: office.note,
  }
}

export function toOfficePayload(input: OfficeInput): OfficePayload {
  return {
    office_code: input.office_code.trim().toUpperCase(),
    name: input.name.trim(),
    address: input.address.trim(),
    phones: [
      ...new Set(input.phones.map((phone) => phone.trim()).filter(Boolean)),
    ],
    note: input.note.trim(),
  }
}