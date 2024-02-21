import { StatusCodes } from 'http-status-codes'
import { AppError } from '../../error/AppError'
import { Rental, RentalProps } from '../../models/Rental'
import { CustomerRepository } from '@/infra/database/repositories/ICustomerRepository'
import { VehicleRepository } from '@/infra/database/repositories/IVehicleRepository'
import { RentalRepository } from '@/infra/database/repositories/IRentalRepository'
import { VehicleType } from '@prisma/client'
import {
  CalculateRentalValueRequest,
  calculateRentalValue,
} from '@/app/utils/calculateRentalValue'

interface CreateRentalServiceResponse {
  rental: Rental
}

export class CreateRentalService {
  constructor(
    private customerRepository: CustomerRepository,
    private vehicleRepository: VehicleRepository,
    private rentalRepository: RentalRepository,
  ) {}

  async execute(rentalData: RentalProps): Promise<CreateRentalServiceResponse> {
    const { customerId, vehicleId, rentalDate, devolutionDate } = rentalData

    const customer = await this.customerRepository.findById(customerId)

    // TODO: separar a validacao de carteira e data de devolucao em utils

    if (!customer) {
      throw new AppError('Customer not found', StatusCodes.NOT_FOUND)
    }

    const vehicle = await this.vehicleRepository.findById(vehicleId)

    if (!vehicle) {
      throw new AppError('Vehicle not found', StatusCodes.NOT_FOUND)
    }

    if (vehicle.isRented) {
      throw new AppError('Vehicle already rented', StatusCodes.BAD_REQUEST)
    }

    if (customer.hasRent) {
      throw new AppError('Customer already has a rent', StatusCodes.BAD_REQUEST)
    }

    if (rentalDate > devolutionDate) {
      throw new AppError('Invalid rental date', StatusCodes.BAD_REQUEST)
    }

    if (
      customer.driverLicense === 'A' &&
      vehicle.type !== VehicleType.MOTORCYCLE
    ) {
      throw new AppError(
        "People with driver license 'A' can rent motorcycles only",
        StatusCodes.BAD_REQUEST,
      )
    }

    if (
      customer.driverLicense === 'B' &&
      vehicle.type === VehicleType.MOTORCYCLE
    ) {
      throw new AppError(
        "People with driver license 'B' can rent cars only",
        StatusCodes.BAD_REQUEST,
      )
    }

    customer.hasRent = true
    vehicle.isRented = true
    const rent = new Rental({
      customerId,
      vehicleId,
      rentalDate,
      devolutionDate,
    })

    const dataToCalculate: CalculateRentalValueRequest = {
      dailyRental: vehicle.dailyRental,
      increasePorcentage: vehicle.increasePorcentage,
      rentalDate,
      devolutionDate,
    }

    rent.rentalValue = calculateRentalValue(dataToCalculate)

    const rental = new Rental(rent)

    await this.rentalRepository.create(rent)

    return {
      rental,
    }
  }
}