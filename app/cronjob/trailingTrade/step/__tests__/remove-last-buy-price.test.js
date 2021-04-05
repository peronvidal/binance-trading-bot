const { mongo, logger } = require('../../../../helpers');

const step = require('../remove-last-buy-price');

describe('remove-last-buy-price.js', () => {
  let result;
  let rawData;

  describe('execute', () => {
    beforeEach(async () => {
      mongo.deleteOne = jest.fn().mockResolvedValue(true);
    });

    describe('when symbol is locked`', () => {
      beforeEach(async () => {
        rawData = {
          action: 'buy',
          isLocked: true,
          symbol: 'BTCUPUSDT',
          symbolInfo: {
            filterLotSize: {
              stepSize: '0.01000000',
              minQty: '0.01000000'
            },
            filterMinNotional: {
              minNotional: '10.00000000'
            }
          },
          openOrders: [],
          baseAssetBalance: {
            free: 0,
            locked: 0
          },
          sell: {
            currentPrice: 200,
            lastBuyPrice: null
          }
        };

        result = await step.execute(logger, rawData);
      });

      it('does not trigger mongo.deleteOne', () => {
        expect(mongo.deleteOne).not.toHaveBeenCalled();
      });

      it('returns expected data', () => {
        expect(result).toStrictEqual(rawData);
      });
    });

    describe('when action is not `not-determined`', () => {
      beforeEach(async () => {
        rawData = {
          action: 'buy',
          isLocked: false,
          symbol: 'BTCUPUSDT',
          symbolInfo: {
            filterLotSize: {
              stepSize: '0.01000000',
              minQty: '0.01000000'
            },
            filterMinNotional: {
              minNotional: '10.00000000'
            }
          },
          openOrders: [],
          baseAssetBalance: {
            free: 0,
            locked: 0
          },
          sell: {
            currentPrice: 200,
            lastBuyPrice: null
          }
        };

        result = await step.execute(logger, rawData);
      });

      it('does not trigger mongo.deleteOne', () => {
        expect(mongo.deleteOne).not.toHaveBeenCalled();
      });

      it('returns expected data', () => {
        expect(result).toStrictEqual(rawData);
      });
    });

    describe('when last buy price is not set', () => {
      beforeEach(async () => {
        rawData = {
          action: 'not-determined',
          isLocked: false,
          symbol: 'BTCUPUSDT',
          symbolInfo: {
            filterLotSize: {
              stepSize: '0.01000000',
              minQty: '0.01000000'
            },
            filterMinNotional: {
              minNotional: '10.00000000'
            }
          },
          openOrders: [],
          baseAssetBalance: {
            free: 0,
            locked: 0
          },
          sell: {
            currentPrice: 200,
            lastBuyPrice: null
          }
        };

        result = await step.execute(logger, rawData);
      });

      it('does not trigger mongo.deleteOne', () => {
        expect(mongo.deleteOne).not.toHaveBeenCalled();
      });

      it('returns expected data', () => {
        expect(result).toStrictEqual(rawData);
      });
    });

    describe('when open orders exist', () => {
      beforeEach(async () => {
        rawData = {
          action: 'not-determined',
          isLocked: false,
          symbol: 'BTCUPUSDT',
          symbolInfo: {
            filterLotSize: {
              stepSize: '0.01000000',
              minQty: '0.01000000'
            },
            filterMinNotional: {
              minNotional: '10.00000000'
            }
          },
          openOrders: [
            {
              orderId: 123,
              price: 197.8,
              quantity: 0.09,
              side: 'sell',
              stopPrice: 198,
              symbol: 'BTCUPUSDT',
              timeInForce: 'GTC',
              type: 'STOP_LOSS_LIMIT'
            }
          ],
          baseAssetBalance: {
            free: 0,
            locked: 0
          },
          sell: {
            currentPrice: 200,
            lastBuyPrice: 190
          }
        };

        result = await step.execute(logger, rawData);
      });

      it('does not trigger mongo.deleteOne', () => {
        expect(mongo.deleteOne).not.toHaveBeenCalled();
      });

      it('returns expected data', () => {
        expect(result).toStrictEqual(rawData);
      });
    });

    describe('when quantity is not enough to sell', () => {
      beforeEach(async () => {
        rawData = {
          action: 'not-determined',
          isLocked: false,
          symbol: 'BTCUPUSDT',
          symbolInfo: {
            filterLotSize: {
              stepSize: '0.01000000',
              minQty: '0.01000000'
            },
            filterMinNotional: {
              minNotional: '10.00000000'
            }
          },
          openOrders: [],
          baseAssetBalance: {
            free: 0,
            locked: 0
          },
          sell: {
            currentPrice: 200,
            lastBuyPrice: 160
          }
        };

        result = await step.execute(logger, rawData);
      });

      it('triggers mongo.deleteOne', () => {
        expect(mongo.deleteOne).toHaveBeenCalledWith(
          logger,
          'trailing-trade-symbols',
          { key: 'BTCUPUSDT-last-buy-price' }
        );
      });

      it('returns expected data', () => {
        expect(result).toStrictEqual({
          ...rawData,
          ...{
            sell: {
              currentPrice: 200,
              lastBuyPrice: 160,
              processMessage:
                'Balance is found; however, not enough to sell. Delete last buy price.',
              updatedAt: expect.any(Object)
            }
          }
        });
      });
    });

    describe('when balance is less than minimum notional', () => {
      beforeEach(async () => {
        rawData = {
          action: 'not-determined',
          isLocked: false,
          symbol: 'BTCUPUSDT',
          symbolInfo: {
            filterLotSize: {
              stepSize: '0.01000000',
              minQty: '0.01000000'
            },
            filterMinNotional: {
              minNotional: '10.00000000'
            }
          },
          openOrders: [],
          baseAssetBalance: {
            free: 0,
            locked: 0.04
          },
          sell: {
            currentPrice: 200,
            lastBuyPrice: 160
          }
        };

        result = await step.execute(logger, rawData);
      });

      it('triggers mongo.deleteOne', () => {
        expect(mongo.deleteOne).toHaveBeenCalledWith(
          logger,
          'trailing-trade-symbols',
          { key: 'BTCUPUSDT-last-buy-price' }
        );
      });

      it('returns expected data', () => {
        expect(result).toStrictEqual({
          ...rawData,
          ...{
            sell: {
              currentPrice: 200,
              lastBuyPrice: 160,
              processMessage:
                'Balance is found; however, the balance is less than the notional value. Delete last buy price.',
              updatedAt: expect.any(Object)
            }
          }
        });
      });
    });

    describe('when there is enough balance', () => {
      beforeEach(async () => {
        rawData = {
          action: 'not-determined',
          isLocked: false,
          symbol: 'BTCUPUSDT',
          symbolInfo: {
            filterLotSize: {
              stepSize: '0.01000000',
              minQty: '0.01000000'
            },
            filterMinNotional: {
              minNotional: '10.00000000'
            }
          },
          openOrders: [],
          baseAssetBalance: {
            free: 0,
            locked: 0.2
          },
          sell: {
            currentPrice: 200,
            lastBuyPrice: 160
          }
        };

        result = await step.execute(logger, rawData);
      });

      it('does not trigger mongo.deleteOne', () => {
        expect(mongo.deleteOne).not.toHaveBeenCalled();
      });

      it('returns expected data', () => {
        expect(result).toStrictEqual({
          ...rawData
        });
      });
    });
  });
});
