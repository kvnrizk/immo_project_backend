import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './entities/contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactStatusDto } from './dto/update-contact-status.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
  ) {}

  async create(createContactDto: CreateContactDto): Promise<Contact> {
    const contact = this.contactRepository.create({
      nom: createContactDto.nom,
      email: createContactDto.email,
      telephone: createContactDto.telephone,
      type_projet: createContactDto.typeProjet,
      type_bien: createContactDto.typeBien,
      nombre_pieces: createContactDto.nombrePieces,
      surface_min: createContactDto.surfaceRange?.[0],
      surface_max: createContactDto.surfaceRange?.[1],
      budget_min: createContactDto.budgetRange?.[0],
      budget_max: createContactDto.budgetRange?.[1],
      localisation: createContactDto.localisation,
      delai: createContactDto.delai,
      message: createContactDto.message,
      status: 'nouveau',
    });

    return await this.contactRepository.save(contact);
  }

  async findAll(): Promise<Contact[]> {
    return await this.contactRepository.find({
      order: {
        created_at: 'DESC',
      },
    });
  }

  async findOne(id: number): Promise<Contact> {
    const contact = await this.contactRepository.findOne({
      where: { id },
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }

    return contact;
  }

  async updateStatus(id: number, updateStatusDto: UpdateContactStatusDto): Promise<Contact> {
    const contact = await this.findOne(id);
    contact.status = updateStatusDto.status;
    return await this.contactRepository.save(contact);
  }

  async remove(id: number): Promise<void> {
    const contact = await this.findOne(id);
    await this.contactRepository.remove(contact);
  }
}
